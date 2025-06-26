package com.Ojt.Ecommerce.security;

import com.Ojt.Ecommerce.entity.User; //add
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority; //add
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors; //add

public class CustomUserDetails implements UserDetails {

    private final User user; //add

    //fix: replace constructor to use User object directly
    public CustomUserDetails(User user) {
        this.user = user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        //add: dynamically build authorities from permissions
        return user.getRole().getPermissions().stream()
                .map(permission -> new SimpleGrantedAuthority(permission.getKey()))
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return user.getPassword(); //fix
    }

    @Override
    public String getUsername() {
        return user.getEmail(); //fix
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    // add: support for Spring Security to check if the account is enabled
    public boolean isEnabled() {
        return user.isVerified();
    }


    public User getUser() {
        return user; //add: for access to User object if needed
    }
}



//package com.Ojt.Ecommerce.security;
//
//import org.springframework.security.core.GrantedAuthority;
//import org.springframework.security.core.userdetails.UserDetails;
//import java.util.Collection;
//import java.util.Set;
//
//
//public class CustomUserDetails implements UserDetails {
//
//    private String email;
//    private String password;
//    private Set<GrantedAuthority> authorities;
//    private boolean enabled;
//
//    public CustomUserDetails(String email, String password, Set<GrantedAuthority> authorities, boolean enabled) {
//        this.email = email;
//        this.password = password;
//        this.authorities = authorities;
//        this.enabled = enabled;
//    }
//
//    @Override
//    public Collection<? extends GrantedAuthority> getAuthorities() {
//        return authorities;
//    }
//
//    @Override
//    public String getPassword() {
//        return password;
//    }
//
//    @Override
//    public String getUsername() {
//        return email;
//    }
//
//    @Override
//    public boolean isAccountNonExpired() {
//        return true;
//    }
//
//    @Override
//    public boolean isAccountNonLocked() {
//        return true;
//    }
//
//    @Override
//    public boolean isCredentialsNonExpired() {
//        return true;
//    }
//
//    @Override
//    public boolean isEnabled() {
//        return enabled;
//    }
//}
//
